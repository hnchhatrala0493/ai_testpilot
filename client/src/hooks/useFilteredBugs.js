import { useMemo } from "react";

export function useFilteredBugs(bugs, filters) {
  return useMemo(() => {
    return bugs.filter((bug) => {
      const statusMatch = !filters.status || bug.status === filters.status;
      const priorityMatch = !filters.priority || bug.priority === filters.priority;
      const projectMatch = !filters.project || bug.project === filters.project;
      const searchMatch =
        !filters.search ||
        bug.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        bug.ticketId.toLowerCase().includes(filters.search.toLowerCase());

      return statusMatch && priorityMatch && projectMatch && searchMatch;
    });
  }, [bugs, filters]);
}
