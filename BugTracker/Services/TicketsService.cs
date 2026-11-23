using BugTracker.Data;
using BugTracker.DTOs.Tickets;
using Microsoft.EntityFrameworkCore;

namespace BugTracker.Services
{
    public class TicketsService : ITicketsService
    {
        private readonly AppDbContext _db;

        public TicketsService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<TicketListItemResponse>> GetProjectTicketsAsync(int projectId)
        {
            return await _db.Tickets.AsNoTracking()
                .Where(ticket => ticket.ProjectId == projectId)
                .OrderByDescending(ticket => ticket.CreatedAt)
                .ThenByDescending(ticket => ticket.Id)
                .Select(ticket => new TicketListItemResponse
                {
                    Id = ticket.Id,
                    Title = ticket.Title,
                    BugStatus = ticket.BugStatus,
                    ReviewStatus = ticket.ReviewStatus,
                    Priority = ticket.Priority,
                    Assignee = ticket.Assignee == null ? null : new TicketAssigneeResponse(
                        ticket.Assignee.Id, ticket.Assignee.FirstName, ticket.Assignee.LastName),
                    Deadline = ticket.Deadline
                })
                .ToListAsync();
        }
    }
}