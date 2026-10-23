import { REGIONS } from "@/lib/current-city";

// Las 50 ciudades de la lista cerrada, agrupadas por región. Lo usan "Mi ciudad", el plan y explorar.
export default function CitySelect({ defaultValue, placeholder = "Elegí la ciudad", onChange }: { defaultValue?: string; placeholder?: string; onChange?: (city: string) => void }) {
  return (
    <select name="city" defaultValue={defaultValue ?? ""} onChange={onChange && (e => onChange(e.currentTarget.value))} required>
      <option value="" disabled>{placeholder}</option>
      {REGIONS.map(r => (
        <optgroup key={r.name} label={r.name}>
          {r.cities.map(([city, country]) => <option key={city} value={city}>{city}, {country}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
