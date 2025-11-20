import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <RadioGroup
        value={theme}
        onValueChange={setTheme}
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          return (
            <div key={themeOption.value} className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value={themeOption.value} id={themeOption.value} />
              <Label htmlFor={themeOption.value} className="font-normal cursor-pointer flex items-center gap-2 flex-1">
                <Icon className="h-4 w-4" />
                <span>{themeOption.label}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
