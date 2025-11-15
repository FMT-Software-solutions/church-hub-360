import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { AssetWithMeta } from '@/types/assets';
import { supabase } from '@/utils/supabase';

interface AssetListPrintServiceProps {
  assets: AssetWithMeta[];
  selectedFields: string[];
  organizationName?: string;
  organizationId?: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  category: 'Category',
  status: 'Status',
  location: 'Location',
  purchase_date: 'Purchase Date',
  assigned_to_type: 'Assigned Type',
  assigned_to_member_id: 'Assigned Member',
  assigned_to_group_id: 'Assigned Group',
  images_count: 'Images Count',
  created_at: 'Created Date',
};

function AssetListPrintView({
  assets,
  selectedFields,
  organizationName,
  memberNames,
  groupNames,
}: {
  assets: AssetWithMeta[];
  selectedFields: string[];
  organizationName?: string;
  memberNames: Record<string, string>;
  groupNames: Record<string, string>;
}) {
  const formatValue = (value: any, fieldKey: string): string => {
    if (value === null || value === undefined) return '';
    if (fieldKey === 'assigned_to_type') {
      if (value === 'member') return 'Member';
      if (value === 'group') return 'Group';
      return '';
    }
    if (fieldKey.includes('date') || fieldKey === 'created_at') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getFieldValue = (asset: AssetWithMeta, fieldKey: string): string => {
    if (fieldKey === 'images_count') {
      const count = Array.isArray(asset.images) ? asset.images.length : 0;
      return String(count);
    }
    if (fieldKey === 'assigned_to_member_id') {
      const id = (asset as any).assigned_to_member_id;
      return id ? memberNames[id] || '' : '';
    }
    if (fieldKey === 'assigned_to_group_id') {
      const id = (asset as any).assigned_to_group_id;
      return id ? groupNames[id] || '' : '';
    }
    const value = (asset as any)[fieldKey];
    return formatValue(value, fieldKey);
  };

  const isLandscape = selectedFields.length > 5;
  const getColumnWidth = () => {
    if (selectedFields.length <= 3) return 'auto';
    if (selectedFields.length <= 5)
      return `${Math.floor(100 / selectedFields.length)}%`;
    return `${Math.floor(100 / selectedFields.length)}%`;
  };

  const pageStyle = `
    @page { size: ${
      isLandscape ? 'A4 landscape' : 'A4 portrait'
    }; margin: 0.5in; }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
  `;

  return (
    <>
      <style>{pageStyle}</style>
      <div
        className="bg-white text-black"
        style={{
          padding: isLandscape ? '16px' : '32px',
          fontSize: isLandscape ? '11px' : '12px',
          lineHeight: '1.4',
        }}
      >
        <div className="mb-4">
          {organizationName && (
            <h2
              className={`font-semibold mb-1 text-gray-700 ${
                isLandscape ? 'text-base' : 'text-lg'
              }`}
            >
              {organizationName}
            </h2>
          )}
          <h1
            className={`font-bold mb-2 ${isLandscape ? 'text-lg' : 'text-2xl'}`}
          >
            Assets Directory
          </h1>
          <p
            className="text-gray-600"
            style={{ fontSize: isLandscape ? '10px' : '14px' }}
          >
            Generated on {new Date().toLocaleDateString()} • {assets.length}{' '}
            assets
          </p>
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #d1d5db',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {selectedFields.map((fieldKey) => (
                <th
                  key={fieldKey}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: isLandscape ? '6px 4px' : '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: isLandscape ? '10px' : '12px',
                    width: getColumnWidth(),
                    wordWrap: 'break-word',
                    overflow: 'hidden',
                  }}
                >
                  {FIELD_LABELS[fieldKey] || fieldKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr
                key={asset.id}
                style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                }}
              >
                {selectedFields.map((fieldKey) => (
                  <td
                    key={fieldKey}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: isLandscape ? '4px 4px' : '8px 12px',
                      fontSize: isLandscape ? '9px' : '11px',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '0',
                      textAlign: 'left',
                      verticalAlign: 'top',
                    }}
                  >
                    {getFieldValue(asset, fieldKey)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AssetListPrintService({
  assets,
  selectedFields,
  organizationName,
  organizationId,
  onComplete,
  onError,
}: AssetListPrintServiceProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${
      organizationName ? `${organizationName} - ` : ''
    }Assets Directory - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => onComplete(),
    onPrintError: (error) => {
      console.error(error);
      onError('Failed to generate print. Please try again.');
    },
  });
  useEffect(() => {
    const run = async () => {
      try {
        // Collect unique IDs
        const memberIds = Array.from(
          new Set(
            assets.map((a) => (a as any).assigned_to_member_id).filter(Boolean)
          )
        ) as string[];
        const groupIds = Array.from(
          new Set(
            assets.map((a) => (a as any).assigned_to_group_id).filter(Boolean)
          )
        ) as string[];

        const names: Record<string, string> = {};
        const gnames: Record<string, string> = {};

        if (memberIds.length > 0) {
          const { data, error } = await supabase
            .from('members_summary')
            .select('id, full_name, first_name, last_name, membership_id')
            .in('id', memberIds)
            .eq('organization_id', organizationId || '');
          if (error) {
            throw error;
          }
          (data || []).forEach((m: any) => {
            const full =
              m.full_name ||
              `${m.first_name || ''} ${m.last_name || ''}`.trim();
            names[m.id] = m.membership_id
              ? `${full} • ${m.membership_id}`
              : full;
          });
        }

        if (groupIds.length > 0) {
          const { data, error } = await supabase
            .from('groups')
            .select('id, name')
            .in('id', groupIds)
            .eq('organization_id', organizationId || '');
          if (error) {
            throw error;
          }
          (data || []).forEach((g: any) => {
            gnames[g.id] = g.name;
          });
        }

        setMemberNames(names);
        setGroupNames(gnames);
        setReady(true);
      } catch (e) {
        console.error(e);
        setReady(true);
      }
    };
    run();
  }, [assets]);

  useEffect(() => {
    if (ready) handlePrint();
  }, [ready]);
  return (
    <div style={{ display: 'none' }}>
      <div ref={printRef}>
        <AssetListPrintView
          assets={assets}
          selectedFields={selectedFields}
          organizationName={organizationName}
          memberNames={memberNames}
          groupNames={groupNames}
        />
      </div>
    </div>
  );
}
