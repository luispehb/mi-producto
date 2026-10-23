import { REGIONS } from "@/lib/current-city";

// Las 50 ciudades de la lista cerrada, agrupadas por región. Lo usan "Mi ciudad", el plan y explorar.
export default function CitySelect({ defaultValue, placeholder = "Elegí la ciudad" }: { defaultValue?: string; placeholder?: string }) {
  return (
    <select name="city" defaultValue={defaultValue ?? ""} required>
      <option value="" disabled>{placeholder}</option>
      {REGIONS.map(r => (
        <optgroup key={r.name} label={r.name}>
          {r.cities.map(([city, country]) => <option key={city} value={city}>{city}, {country}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
