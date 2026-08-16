import { Text, View } from 'react-native';

import { StatusBanner } from '@/design-system/StatusBanner';
import { isFeatureEnabled } from '@/config/feature-flags';

export default function ShopScreen() {
  const partnerFeedEnabled = isFeatureEnabled('shopPartnerFeed');

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 pt-16 px-4">
      <Text className="text-3xl font-extrabold text-black dark:text-white">
        Entdecken
      </Text>
      <Text className="text-zinc-500 mt-1 mb-6 leading-6">
        Fehlende Teile sollen später nur aus echten Partner-/Produktdaten vorgeschlagen werden.
      </Text>

      {partnerFeedEnabled ? (
        <StatusBanner
          tone="warning"
          title="Partner-Feed noch nicht verbunden"
          message="Das Feature-Flag ist aktiv, aber es liegt noch keine produktionsvalidierte Shop-Datenquelle vor. Omni Fashion zeigt deshalb keine erfundenen Produkte oder Preise an."
        />
      ) : (
        <StatusBanner
          tone="neutral"
          title="Smart Shop ist noch nicht Teil des aktiven MVP"
          message="Der bisherige Demo-Shop mit hartcodierten Marken, Preisen und Unsplash-Bildern wurde entfernt. Dieser Bereich wird erst aktiviert, wenn echte Gap-to-Shop-Logik, Partnerdaten, Tracking-Regeln und Datenschutz geklärt sind."
        />
      )}
    </View>
  );
}
