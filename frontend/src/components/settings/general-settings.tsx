import { Trans } from "@lingui/react/macro";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";

export function GeneralSettings() {
    return (
        <div className="p-8 max-w-2xl space-y-6">
            <div>
                <h3 className="text-lg font-medium"><Trans>General Settings</Trans></h3>
                <p className="text-sm text-muted-foreground"><Trans>Configure general options for the application.</Trans></p>
            </div>
            
            <div className="space-y-4">
                <LanguageSwitcher />
                <ModeToggle />
            </div>
        </div>
    );
}
