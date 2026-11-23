using BugTracker.DTOs.Tickets;

namespace BugTracker.DTOs.Projects
{
    public class ProjectDetailsResponse : ProjectResponse
    {
        public List<TicketListItemResponse> Tickets { get; set; } = new();
    }
}