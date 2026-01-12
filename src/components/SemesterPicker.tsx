import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSemesters } from "@/hooks/useSemesters";
import { Loader2 } from "lucide-react";

export function SemesterPicker() {
    const { semesters, activeSemester, updateSemester, isLoading } = useSemesters();

    const handleValueChange = (value: string) => {
        updateSemester.mutate({ id: value, is_active: true });
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    if (semesters.length === 0) {
        return null;
    }

    return (
        <Select value={activeSemester?.id} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
                {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
