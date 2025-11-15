 
import type { AssetWithMeta } from '@/types/assets'

interface AssetDetailPrintViewProps {
  asset: AssetWithMeta
  memberName?: string | null
  groupName?: string | null
  organizationName?: string
}

export default function AssetDetailPrintView({ asset, memberName, groupName, organizationName }: AssetDetailPrintViewProps) {
  const pageStyle = `
    @page { size: A4 portrait; margin: 0.5in; }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      img { page-break-inside: avoid; }
    }
  `
  return (
    <>
      <style>{pageStyle}</style>
      <div className="bg-white text-black" style={{ padding: '32px' }}>
        <div className="mb-4">
          {organizationName && (
            <h2 className="font-semibold mb-1 text-gray-700 text-lg">{organizationName}</h2>
          )}
          <h1 className="font-bold mb-2 text-2xl">Asset Details</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-semibold">{asset.name}</span>
            {asset.category && <span className="px-2 py-1 border rounded text-sm">{asset.category}</span>}
            {asset.status && <span className="px-2 py-1 bg-gray-100 rounded text-sm">{asset.status}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-base">{asset.location || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Purchase Date</div>
              <div className="text-base">{asset.purchase_date || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Assigned To</div>
              <div className="text-base">
                {asset.assigned_to_type === 'member' && memberName ? memberName : asset.assigned_to_type === 'group' && groupName ? groupName : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created</div>
              <div className="text-base">{new Date(asset.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          {asset.description && (
            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-base">{asset.description}</div>
            </div>
          )}
          {asset.images && asset.images.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {asset.images.map((url) => (
                  <div key={url} className="border rounded-md overflow-hidden">
                    <img src={url} alt="asset" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
