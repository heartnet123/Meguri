for file in $(grep -rl "workspaceId ?" app/); do
    sed -i "s/workspaceId ? { workspaceId } : 'skip'/workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'/g" $file
    sed -i "s/workspaceId ? { workspaceId, periodDays } : 'skip'/workspaceId ? { workspaceId: workspaceId as Id<'workspaces'>, periodDays } : 'skip'/g" $file
    sed -i "s/const args = workspaceId ? { workspaceId } : 'skip'/const args = workspaceId ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'/g" $file
    sed -i "s/resolveAll({ workspaceId })/resolveAll({ workspaceId: workspaceId as Id<'workspaces'> })/g" $file
done
