using BugTracker.DTOs.Tickets;

namespace BugTracker.Services
{
    public interface ITicketsService
    {
        Task<List<TicketListItemResponse>> GetProjectTicketsAsync(int projectId);
    }
}