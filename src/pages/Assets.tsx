import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { useAssets } from '@/hooks/assets/useAssets';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Pencil, Plus } from 'lucide-react';
import { useDeleteAsset } from '@/hooks/assets/useAssets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import AssetListPrintService from '@/components/assets/AssetListPrintService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';

const CATEGORY_OPTIONS = [
  'All',
  'Furniture',
  'Instruments',
  'Audio/Visual',
  'Electricals',
  'Vehicles',
  'Office Equipment',
  'Other',
];
const STATUS_OPTIONS = ['All', 'Active', 'In Storage', 'Damaged', 'Retired'];

export default function Assets() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [location, setLocation] = useState('');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [printOpen, setPrintOpen] = useState(false);
  const [startPrint, setStartPrint] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'category',
    'status',
    'location',
    'images_count',
  ]);
  const availableFields = [
    'name',
    'category',
    'status',
    'location',
    'purchase_date',
    'assigned_to_member_id',
    'assigned_to_group_id',
    'images_count',
    'created_at',
  ];
  const fieldLabels: Record<string, string> = {
    name: 'Name',
    category: 'Category',
    status: 'Status',
    location: 'Location',
    purchase_date: 'Purchase Date',
    assigned_to_type: 'Assignment Type',
    assigned_to_member_id: 'Assigned Member',
    assigned_to_group_id: 'Assigned Group',
    images_count: 'Image Count',
    created_at: 'Created Date',
  };

  const params = useMemo(
    () => ({
      page,
      pageSize,
      search,
      category: category === 'All' ? undefined : category,
      status: status === 'All' ? undefined : status,
      location: location || undefined,
      branch_id: branchId || undefined,
    }),
    [page, pageSize, search, category, status, location, branchId]
  );

  const { data, isLoading } = useAssets(params);
  const navigate = useNavigate();
  const del = useDeleteAsset();
  const { currentOrganization } = useOrganization();

  const items = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Assets</h2>
        <div className="flex items-center gap-2">
          <Dialog open={printOpen} onOpenChange={setPrintOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Print</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select fields to print</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {availableFields.map((f) => {
                  const checked = selectedFields.includes(f);
                  return (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          setSelectedFields((prev) => {
                            if (val) return [...prev, f];
                            return prev.filter((x) => x !== f);
                          });
                        }}
                      />
                      <span className="truncate">{fieldLabels[f] || f}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setPrintOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setPrintOpen(false);
                    setStartPrint(true);
                    setTimeout(() => setStartPrint(false), 1000);
                  }}
                >
                  Print
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => navigate('/assets/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
          />
          <SingleBranchSelector
            value={branchId}
            onValueChange={(v) => {
              setBranchId(v);
              setPage(1);
            }}
            placeholder="All branches"
            allowClear
          />
        </div>
      </Card>

      <Card className="p-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Images</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              items.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category || '-'}</TableCell>
                  <TableCell>{asset.status || '-'}</TableCell>
                  <TableCell>{asset.location || '-'}</TableCell>
                  <TableCell>
                    {asset.images?.length ? asset.images.length : 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assets/${asset.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => del.mutate(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Separator />
        <div className="p-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemName="assets"
          />
        </div>
      </Card>
      {startPrint && (
        <AssetListPrintService
          assets={items}
          selectedFields={selectedFields}
          organizationName={currentOrganization?.name}
          organizationId={currentOrganization?.id}
          onComplete={() => setStartPrint(false)}
          onError={() => setStartPrint(false)}
        />
      )}
    </div>
  );
}
