import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFontSize } from "@/contexts/FontSizeContext";

const fontSizes = [
  { value: 'small', label: 'Pequeno', description: '90% do tamanho padrão' },
  { value: 'normal', label: 'Normal', description: '100% - Tamanho padrão' },
  { value: 'large', label: 'Grande', description: '110% do tamanho padrão' },
  { value: 'xlarge', label: 'Extra Grande', description: '120% do tamanho padrão' },
] as const;

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="space-y-4">
      <RadioGroup
        value={fontSize}
        onValueChange={(value) => setFontSize(value as typeof fontSize)}
      >
        {fontSizes.map((size) => (
          <div key={size.value} className="flex items-center space-x-3 space-y-0">
            <RadioGroupItem value={size.value} id={size.value} />
            <Label htmlFor={size.value} className="font-normal cursor-pointer flex-1">
              <div className="flex flex-col">
                <span className="font-medium">{size.label}</span>
                <span className="text-sm text-muted-foreground">{size.description}</span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
