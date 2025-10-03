import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Printer,
  Mail,
  Phone,
} from 'lucide-react';
import type { MemberSummary, MembershipStatus } from '@/types';

interface MemberTableProps {
  members: MemberSummary[];
  isLoading?: boolean;
  onEdit?: (member: MemberSummary) => void;
  onDelete?: (memberId: string) => Promise<void>;
  onView?: (member: MemberSummary) => void;
  onToggleStatus?: (member: MemberSummary) => void;
  onPrint?: (member: MemberSummary) => void;
  onClick?: (memberId: string) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  className?: string;
}

const statusColors: Record<MembershipStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  transferred: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  deceased: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export function MemberTable({
  members,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onPrint,
  onClick,
  onSort,
  className,
}: MemberTableProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  const handleAction = async (memberId: string, action: () => void | Promise<void>) => {
    setLoadingMemberId(memberId);
    try {
      await action();
    } finally {
      setLoadingMemberId(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-semibold hover:bg-transparent"
        onClick={() => onSort?.(field)}
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className={cn('rounded-md border', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {onSort ? (
              <>
                <SortableHeader field="full_name">Member</SortableHeader>
                <TableHead>Contact</TableHead>
                <SortableHeader field="membership_status">Status</SortableHeader>
                <SortableHeader field="membership_type">Type</SortableHeader>
                <SortableHeader field="date_joined">Joined</SortableHeader>
                <SortableHeader field="age">Age</SortableHeader>
              </>
            ) : (
              <>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Age</TableHead>
              </>
            )}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow 
                key={member.id} 
                className={cn(
                  "hover:bg-muted/50",
                  onClick && "cursor-pointer"
                )}
                onClick={() => onClick?.(member.id)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile_image_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {member.membership_id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {member.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-1 h-3 w-3" />
                        <span className="truncate max-w-[200px]">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-1 h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {!member.email && !member.phone && (
                      <span className="text-sm text-muted-foreground">No contact info</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', statusColors[member.membership_status])}>
                    {member.membership_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.membership_type ? (
                    <Badge variant="outline" className="text-xs">
                      {member.membership_type}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not specified</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(member.date_joined)}
                </TableCell>
                <TableCell className="text-sm">
                  {member.age !== null ? `${member.age}` : 'N/A'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={loadingMemberId === member.id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onView && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(member.id, () => onView(member));
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(member.id, () => onEdit(member));
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Member
                        </DropdownMenuItem>
                      )}
                      {onPrint && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(member.id, () => onPrint(member));
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print Details
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(member.id, () => onToggleStatus(member));
                            }}
                          >
                            {member.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(member.id, () => onDelete(member.id));
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}