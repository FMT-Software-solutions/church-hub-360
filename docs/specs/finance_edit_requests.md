# Finance Record Edit Locking & Request System

## Overview

This document outlines the plan to implement a "Lock by Default" mechanism for finance records (Income, Expenses, etc.). Users must request permission to edit a record. Owners can approve or reject these requests. This ensures data integrity and prevents concurrent edits, while providing an audit trail of who edited what and why.

## 1. Database Schema Changes

We need to introduce a system to track requests and potentially a generic notification system for future extensibility.

### 1.1 New Table: `edit_requests`

Stores the state of access requests.

```sql
CREATE TABLE public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Target Record
    table_name TEXT NOT NULL CHECK (table_name IN ('income', 'expense', 'pledge_payment')),
    record_id UUID NOT NULL, -- The ID of the income/expense record

    -- Request Details
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')) DEFAULT 'pending',

    -- Approval Details
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- Concurrency Control: Only one active request per record
    -- We can use a partial unique index to enforce this
    CONSTRAINT one_active_request_per_record UNIQUE (table_name, record_id)
        WHERE (status IN ('pending', 'approved'))
);

-- Index for quick lookups
CREATE INDEX idx_edit_requests_lookup ON public.edit_requests(table_name, record_id);
CREATE INDEX idx_edit_requests_status ON public.edit_requests(status);
```

### 1.2 New Table: `notifications` (Generic)

To support the requirement: "implement the UI in such a way that... it will be easier to integrate [other notifications]".

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    type TEXT NOT NULL, -- e.g., 'edit_request_created', 'edit_request_decided'
    title TEXT NOT NULL,
    message TEXT,

    -- Link to the source
    resource_type TEXT, -- 'edit_request'
    resource_id UUID, -- edit_requests.id

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

### 1.3 RLS Policies (Security)

- **edit_requests**:
  - `ALL`: Enable full access for authenticated users to simplify the workflow. Application logic will handle the state transitions and validation.
- **income/expenses**:
  - `UPDATE`: Enable access for authenticated users. The application (UI/Service layer) will enforce that an approved request must exist before submitting an update.

## 2. Logic & Workflow

### 2.1 Request Flow

The entry points for editing (Table Row Actions -> Edit, Details View -> Edit Record) remain unchanged. The "Request" logic is encapsulated entirely within the Edit Dialog.

1. **User Action**: User clicks "Edit" on a finance record (from the table or details view).
2. **Dialog Opens**: The Edit Dialog (`IncomeFormDialog` or `ExpenseForm`) opens.
3. **State Check**: The dialog immediately fetches the current `edit_request` status for this record.
4. **Conditional UI (Inside Dialog)**:
   - **Case A: No Active Request (or Expired/Rejected)**
     - **UI**: Shows a "Request Edit Access" view overlaying or replacing the form.
     - **Action**: User enters a reason and clicks "Request Access".
     - **Outcome**: A pending request is created; UI switches to "Pending".
   - **Case B: Request Pending (Current User)**
     - **UI**: Shows a "Request Pending" banner/state.
     - **Actions**:
       - "Refresh Status" button to check if an owner has approved.
       - "Cancel Request" button to withdraw.
   - **Case C: Locked by Another User**
     - **UI**: Shows a "Locked by [User Name]" warning.
     - **Action**: User cannot request access until the current lock is released/completed.
   - **Case D: Approved (Current User)**
     - **UI**: Shows the standard Edit Form with all fields editable.
     - **Action**: User makes changes and clicks "Save".
5. **Completion**:
   - On successful save, the application updates the finance record.
   - The application also marks the `edit_request` as `completed`.
   - The dialog closes.

### 2.2 Approval Flow

1. **Owner** sees notification in Topbar.
2. **Owner** clicks notification, opens a "Requests" drawer/modal or navigates to the record.
3. **Owner** approves or rejects.
   - **Approve**: Update `status = 'approved'`, `reviewer_id = owner`. Create notification for Requester.
   - **Reject**: Update `status = 'rejected'`. Create notification for Requester.

### 2.3 Editing & Auto-Lock

1. **Requester** sees "Approved" status (after refresh).
2. **Requester** makes changes and saves.
3. **On Save Success**:
   - Update `income`/`expense` record.
   - Update `edit_requests` status to `completed`.
   - **Result**: Record is locked again for everyone.

## 3. Component Architecture & Changes

### 3.1 New Components

- **`RequestEditDialog`**: Form to submit reason.
- **`EditRequestStatusBanner`**: Shows current status (Locked, Pending, Approved) at the top of the form.
- **`NotificationCenter`**: Popover in Header to list notifications.
- **`RequestManagementDrawer`** (or Modal): For owners to view list of pending requests and take action.

### 3.2 Modified Components

- **`IncomeFormDialog.tsx` / `ExpenseForm.tsx`**:
  - Wrap fields in a `fieldset` disabled by default.
  - Inject `EditRequestStatusBanner` at the top.
  - Intercept "Save" to mark request as `completed`.
- **`Header.tsx`**:
  - Add `NotificationCenter` icon/component.
- **`FinanceDataTable.tsx`**:
  - Optional: Show a lock icon if the record is currently being edited.

### 3.3 Hooks & State

- **`useEditRequest(tableName, recordId)`**:
  - Fetches current request status.
  - Methods: `requestAccess(reason)`, `cancelRequest()`, `completeRequest()`.
- **`useNotifications()`**:
  - Fetches unread notifications for current user.
  - Methods: `markAsRead()`.
- **`usePendingRequests()`**:
  - For owners to fetch all pending requests.
  - Methods: `approve(id)`, `reject(id)`.

## 4. Potential Issues & Solutions

| Issue                                                    | Solution                                                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Concurrency** (User A and B request same time)         | DB Unique Constraint `(table_name, record_id)` for pending/approved statuses will fail the second insert. Catch error and show "Record already requested by..." |
| **Stale UI** (Owner approves, User doesn't know)         | User's view has a "Refresh Status" button.                                                                                                                      |
| **Forgotten Locks** (User gets approved but never edits) | Cron job or scheduled function to expire `approved` requests after X hours. OR UI shows "Release Lock" button.                                                  |
| **Owner Access**                                         | Owners should also go through the flow to prevent conflict, but can have "Auto-Approve" (One-click unlock).                                                     |
| **Breaking Changes**                                     | The default state changes from "Editable" to "Read-only". Users need to be educated.                                                                            |

## 5. Implementation Plan

1.  **Backend (Migration)**:
    - Create `edit_requests` and `notifications` tables.
    - Set up RLS policies.
2.  **Frontend (State/Hooks)**:
    - Implement `useEditRequest` and `useNotifications`.
3.  **Frontend (UI - Notification)**:
    - Build `NotificationCenter` in Header.
4.  **Frontend (UI - Request Flow)**:
    - Update `IncomeFormDialog` and `ExpenseForm`.
    - Implement `RequestEditDialog`.
    - Add logic to handle "Locked", "Pending", "Approved" states.
5.  **Frontend (UI - Owner)**:
    - Implement approval interface (within Notification Center or on the record itself).
6.  **Testing**:
    - Verify blocking behavior.
    - Verify concurrency handling.
    - Verify full cycle: Request -> Approve -> Edit -> Lock.
