import AssetDetailPrintView from '@/components/assets/AssetDetailPrintView';
import { SellAssetDialog } from '@/components/assets/SellAssetDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useAsset } from '@/hooks/assets/useAssets';
import { useGroup } from '@/hooks/useGroups';
import { useMemberDetails } from '@/hooks/useMemberSearch';
import { format } from 'date-fns';
import { ArrowUpRight, TrendingDown } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

export default function AssetDetail() {
  const { assetId = '' } = useParams();
  const { data } = useAsset(assetId);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const memberIds = data?.assigned_to_member_id
    ? [data.assigned_to_member_id]
    : [];
  const { data: memberDetails } = useMemberDetails(memberIds);
  const { data: groupDetails } = useGroup(data?.assigned_to_group_id || null);

  if (!data) {
    return (
      <div className="p-2 sm:p-4">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Asset Details</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/assets')}>
            Back to Assets
          </Button>
          <Button variant="outline" onClick={() => handlePrint()}>
            Print
          </Button>
          <Button onClick={() => navigate(`/assets/${assetId}/edit`)}>
            Edit
          </Button>
          {data.status !== 'Sold' && <SellAssetDialog asset={data} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-3 sm:p-4 md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-medium">{data.name}</span>
            {data.status && (
              <Badge
                variant={data.status === 'Sold' ? 'destructive' : 'secondary'}
              >
                {data.status}
              </Badge>
            )}
            {data.category && <Badge variant="outline">{data.category}</Badge>}
          </div>

          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Location</TableCell>
                <TableCell>{data.location || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Purchase Date</TableCell>
                <TableCell>{data.purchase_date || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Assigned To</TableCell>
                <TableCell>
                  {data.assigned_to_type === 'member' &&
                  data.assigned_to_member_id &&
                  memberDetails &&
                  memberDetails[0] ? (
                    <span className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={memberDetails[0].profile_image_url || ''}
                        />
                        <AvatarFallback>
                          {memberDetails[0].full_name ||
                            `${memberDetails[0].first_name} ${memberDetails[0].last_name}`.trim()}
                        </AvatarFallback>
                      </Avatar>
                      {memberDetails[0].full_name ||
                        `${memberDetails[0].first_name} ${memberDetails[0].last_name}`.trim()}
                      {memberDetails[0].membership_id
                        ? ` • ${memberDetails[0].membership_id}`
                        : ''}

                      {memberDetails[0].phone
                        ? ` • ${memberDetails[0].phone}`
                        : ''}
                    </span>
                  ) : data.assigned_to_type === 'group' &&
                    data.assigned_to_group_id &&
                    groupDetails ? (
                    <span>{groupDetails.name}</span>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Description</TableCell>
                <TableCell>{data.description || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {data.images && data.images.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Images</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {data.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="asset"
                    className="w-full h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Financial Summary Card */}
        <Card className="p-4 h-fit">
          <div className="space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              Financial Summary
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">
                  Purchase Cost
                </span>
                <span className="text-2xl font-bold">
                  {data.purchase_cost
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'GHS',
                      }).format(data.purchase_cost)
                    : '-'}
                </span>
              </div>

              {data.depreciation_percentage && data.purchase_cost && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      Depreciation ({data.depreciation_percentage}%)
                    </span>
                    <span className="font-medium text-red-500">
                      -
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'GHS',
                      }).format(
                        (data.purchase_cost * data.depreciation_percentage) /
                          100
                      )}
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Current Book Value
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'GHS',
                      }).format(
                        Math.max(
                          0,
                          data.purchase_cost -
                            (data.purchase_cost *
                              data.depreciation_percentage) /
                              100
                        )
                      )}
                    </span>
                  </div>
                </>
              )}

              {data.status === 'Sold' && data.sold_amount && (
                <div className="pt-4 border-t bg-destructive/10 -mx-4 px-4 pb-2">
                  <div className="flex items-center gap-2 text-destructive font-semibold mb-2 pt-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Sold Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block">
                        Sold Date
                      </span>
                      <span>
                        {data.sold_date
                          ? format(new Date(data.sold_date), 'dd MMM, yyyy')
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Sold Amount
                      </span>
                      <span className="font-bold">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'GHS',
                        }).format(data.sold_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <AssetDetailPrintView
            asset={data}
            memberName={
              data.assigned_to_type === 'member' &&
              data.assigned_to_member_id &&
              memberDetails &&
              memberDetails[0]
                ? memberDetails[0].full_name ||
                  `${memberDetails[0].first_name} ${memberDetails[0].last_name}`.trim()
                : null
            }
            groupName={
              data.assigned_to_type === 'group' && groupDetails
                ? groupDetails.name
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
