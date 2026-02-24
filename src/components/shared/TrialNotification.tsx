import { buyNowURL } from '@/constants/urls';
import { useOrganization } from '../../contexts/OrganizationContext';
import { TrialNotification as SharedTrialNotification } from '@/shared-packages/trial-package';
import { openExternalUrl } from '@/utils';

export function TrialNotification() {
  const { currentOrganization } = useOrganization();

  const handleBuyNow = () => {
    openExternalUrl(buyNowURL);
  };

  return (
    <SharedTrialNotification
      organization={currentOrganization}
      onBuyNow={handleBuyNow}
      storageKeyPrefix="churchhub_trial_notification_"
    />
  );
}
