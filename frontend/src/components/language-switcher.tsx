import { useLingui } from "@lingui/react";
import { dynamicActivate, locales } from "@/i18n";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";

export function LanguageSwitcher() {
  const { i18n, _ } = useLingui();

  const handleLanguageChange = (locale: string) => {
    dynamicActivate(locale);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language"><Trans>Language</Trans></Label>
      <Select value={i18n.locale} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language" className="w-50">
          <SelectValue placeholder={_(msg`Select language`)} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(locales).map(([locale, label]) => (
            <SelectItem key={locale} value={locale}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        <Trans>Choose the display language of the application</Trans>
      </p>
    </div>
  );
}
