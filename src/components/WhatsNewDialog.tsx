import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CURRENT_VERSION, getNewEntries, ChangelogEntry } from "@/lib/changelog";

const STORAGE_KEY = "lastSeenVersion";

export function WhatsNewDialog() {
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);

    useEffect(() => {
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        const newEntries = getNewEntries(lastSeen);

        if (newEntries.length > 0) {
            setEntries(newEntries);
            setOpen(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
        setOpen(false);
    };

    if (entries.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleDismiss();
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        What's New
                    </DialogTitle>
                    <DialogDescription>
                        Check out the latest improvements
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-80 overflow-y-auto py-2">
                    {entries.map((entry) => (
                        <div key={entry.version} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    v{entry.version}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {entry.date}
                                </span>
                            </div>
                            <h4 className="font-medium text-sm">{entry.title}</h4>
                            <ul className="space-y-1.5">
                                {entry.highlights.map((highlight, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleDismiss}>
                        Got it!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
