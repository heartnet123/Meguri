for file in $(grep -rl "Id<" app/); do
    if ! grep -q "import type { Id }" $file; then
        sed -i '1i import type { Id } from "@/convex/_generated/dataModel";' $file
    fi
done
