import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { _ } = useLingui();

  return (
    <div className="space-y-2">
      <Label htmlFor="theme"><Trans>Theme</Trans></Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger id="theme" className="w-50">
          <SelectValue placeholder={_(msg`Select theme`)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light"><Trans>Light</Trans></SelectItem>
          <SelectItem value="dark"><Trans>Dark</Trans></SelectItem>
          <SelectItem value="system"><Trans>System</Trans></SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        <Trans>Choose the theme appearance of the application</Trans>
      </p>
    </div>
  );
}