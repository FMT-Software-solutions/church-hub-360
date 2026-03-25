import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounceValue } from '@/hooks/useDebounce';
import type { AttendanceLocation } from '@/types/attendance';
import L, { type LatLngTuple } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Loader2, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const FALLBACK_CENTER: LatLngTuple = [0, 0];

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface ReverseResult {
  display_name?: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    region?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
  };
}

interface LocationPickerProps {
  value: AttendanceLocation | null;
  onChange: (location: AttendanceLocation) => void;
  disabled?: boolean;
  defaultRadius?: number;
}

function MapViewportController({
  center,
  zoom,
  disabled,
  onMapClick,
}: {
  center: LatLngTuple;
  zoom: number;
  disabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(event) {
      if (disabled) return;
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
    });
  }, [center, map, zoom]);

  return null;
}

function buildLocationPayload(
  lat: number,
  lng: number,
  radius: number,
  reverseData?: ReverseResult
): AttendanceLocation {
  const address = reverseData?.address;

  return {
    lat,
    lng,
    radius,
    country: address?.country || null,
    city:
      address?.city ||
      address?.town ||
      address?.village ||
      address?.municipality ||
      null,
    state_region: address?.state || address?.region || null,
    street:
      address?.road ||
      address?.neighbourhood ||
      address?.suburb ||
      null,
    full_address: reverseData?.display_name || null,
  };
}

function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number | undefined | null;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
  defaultRadius = 100,
}: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const debouncedSearchTerm = useDebounceValue(searchTerm.trim(), 450);

  const currentCenter = useMemo<LatLngTuple>(() => {
    if (typeof value?.lat === 'number' && typeof value?.lng === 'number') {
      return [value.lat, value.lng];
    }

    return FALLBACK_CENTER;
  }, [value?.lat, value?.lng]);

  const hasLocation = typeof value?.lat === 'number' && typeof value?.lng === 'number';
  const mapZoom = hasLocation ? 16 : 2;

  useEffect(() => {
    if (disabled || hasLocation || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const radius = value?.radius ?? defaultRadius;

        setIsResolvingLocation(true);

        try {
          const params = new URLSearchParams({
            format: 'jsonv2',
            lat: String(lat),
            lon: String(lng),
            addressdetails: '1',
            zoom: '18',
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
          );

          const data = (await response.json()) as ReverseResult;
          onChange(buildLocationPayload(lat, lng, radius, data));
        } catch {
          onChange({
            lat,
            lng,
            radius,
          });
        } finally {
          setIsResolvingLocation(false);
        }
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [defaultRadius, disabled, hasLocation, onChange, value?.radius]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;

    const searchLocations = async () => {
      setIsSearching(true);
      setSearchError(null);
      setPopoverOpen(true);

      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          q: debouncedSearchTerm,
          limit: '5',
          addressdetails: '1',
          featuretype: 'settlement', // Prioritizes places but also finds POIs
          namedetails: '1', // Get extra details for better matching
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const results = (await response.json()) as SearchResult[];

        if (!cancelled) {
          setSearchResults(results);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError('Unable to search locations right now');
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    void searchLocations();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  const resolveSelectedLocation = async (lat: number, lng: number) => {
    if (disabled) {
      return;
    }

    setIsResolvingLocation(true);

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(lat),
        lon: String(lng),
        addressdetails: '1',
        zoom: '18',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = (await response.json()) as ReverseResult;
      onChange(buildLocationPayload(lat, lng, value?.radius ?? defaultRadius, data));
    } catch {
      onChange({
        lat,
        lng,
        radius: value?.radius ?? defaultRadius,
        country: value?.country ?? null,
        city: value?.city ?? null,
        state_region: value?.state_region ?? null,
        street: value?.street ?? null,
        full_address: value?.full_address ?? null,
      });
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleSearchSelection = async (result: SearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    setSearchTerm(result.display_name);
    setSearchResults([]);
    setPopoverOpen(false);
    await resolveSelectedLocation(lat, lng);
  };

  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    await resolveSelectedLocation(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (disabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await resolveSelectedLocation(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const updateRadius = (nextRadius: string) => {
    const parsedRadius = Number(nextRadius);

    if (!value) {
      return;
    }

    onChange({
      ...value,
      radius: Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : undefined,
    });
  };

  const summary = {
    country: value?.country || '—',
    state_region: value?.state_region || '—',
    city: value?.city || '—',
    street: value?.street || '—',
    full_address: value?.full_address || '—',
    lat: typeof value?.lat === 'number' ? value.lat.toFixed(6) : '—',
    lng: typeof value?.lng === 'number' ? value.lng.toFixed(6) : '—',
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="location-search">Search location</Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  id="location-search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    if (event.target.value.trim() === '') {
                      setPopoverOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchTerm.trim() !== '') {
                      setPopoverOpen(true);
                    }
                  }}
                  placeholder="Search by church name, street, city or landmark"
                  disabled={disabled}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--radix-popover-trigger-width)]"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <ScrollArea className="max-h-60">
                <div className="p-2">
                  {isSearching && (
                    <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching locations...
                    </div>
                  )}

                  {!isSearching && searchError && (
                    <div className="px-2 py-3 text-sm text-destructive">
                      {searchError}
                    </div>
                  )}

                  {!isSearching &&
                    !searchError &&
                    searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-muted"
                        onClick={() => void handleSearchSelection(result)}
                        disabled={disabled}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{result.display_name}</span>
                      </button>
                    ))}

                  {!isSearching &&
                    !searchError &&
                    debouncedSearchTerm &&
                    searchResults.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        No matching locations found
                      </div>
                    )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location-radius">Radius (m)</Label>
          <div className="flex gap-2">
            <Input
              id="location-radius"
              type="number"
              min="1"
              max="100000"
              value={value?.radius ?? ''}
              onChange={(event) => updateRadius(event.target.value)}
              placeholder="Radius (m)"
              disabled={disabled || !value}
              className="w-full min-w-32"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={disabled}
              className="shrink-0"
              title="Use current location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Search, drag the marker, or use your current location
            </p>
          </div>
          {(isResolvingLocation || isSearching) && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating
            </Badge>
          )}
        </div>

        <div className="h-[320px] w-full">
          <MapContainer
            center={currentCenter}
            zoom={mapZoom}
            className="h-full w-full"
            scrollWheelZoom
          >
            <MapViewportController
              center={currentCenter}
              zoom={mapZoom}
              disabled={disabled}
              onMapClick={(lat, lng) => void resolveSelectedLocation(lat, lng)}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasLocation && value && (
              <>
                <Marker
                  position={[value.lat, value.lng]}
                  icon={defaultMarkerIcon}
                  draggable={!disabled}
                  eventHandlers={{
                    dragend: (event) => {
                      const marker = event.target as L.Marker;
                      const position = marker.getLatLng();
                      void handleMarkerDragEnd(position.lat, position.lng);
                    },
                  }}
                />
                {value.radius ? (
                  <Circle
                    center={[value.lat, value.lng]}
                    radius={value.radius}
                    pathOptions={{
                      color: 'hsl(var(--primary))',
                      fillColor: 'hsl(var(--primary))',
                      fillOpacity: 0.12,
                    }}
                  />
                ) : null}
              </>
            )}
          </MapContainer>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 rounded-xl border bg-muted/20 p-4 text-sm">
        <SummaryItem label="Full Address" value={summary.full_address} className="sm:col-span-2 md:col-span-3 lg:col-span-4" />
        <SummaryItem label="City" value={summary.city} />
        <SummaryItem label="State / Region" value={summary.state_region} />
        <SummaryItem label="Country" value={summary.country} />
        <SummaryItem
          label="Radius"
          value={value?.radius ? `${value.radius.toLocaleString()} m` : '—'}
        />
        <SummaryItem label="Latitude" value={summary.lat ? Number(summary.lat).toFixed(6) : undefined} />
        <SummaryItem label="Longitude" value={summary.lng ? Number(summary.lng).toFixed(6) : undefined} />
      </div>
    </div>
  );
}
