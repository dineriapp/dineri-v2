import { AppearanceSettings, UpdateFunctionType } from '@/lib/types/appearnace';
import { Type } from 'lucide-react';
import { Card } from '../jsx-utils';
import { FONT_OPTIONS } from '../utils';

type Props = {
    appearance: AppearanceSettings;
    update: UpdateFunctionType;
}
const TypographySection = ({ appearance, update }: Props) => {
    return (
        <Card icon={Type} title="Typography" desc="Choose a font family for your page.">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {FONT_OPTIONS.map((f) => {
                    const active = appearance.fontFamily === f.id;
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => update("fontFamily", f.id)}
                            className={`rounded-xl border p-3 text-left transition ${active ? "border-lime bg-lime/10" : "border-white/10 bg-surface-1 hover:border-white/25"}`}
                        >
                            <div className="text-lg" style={{ fontFamily: f.stack }}>Aa</div>
                            <div className="mt-1 text-xs text-muted-foreground">{f.label}</div>
                        </button>
                    );
                })}
            </div>
        </Card>
    )
}

export default TypographySection
