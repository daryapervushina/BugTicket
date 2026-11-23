using BugTracker.Models.Enums;
using System.Text.Json.Serialization;

namespace BugTracker.DTOs.Tickets
{
    public class TicketListItemResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        [JsonConverter(typeof(JsonStringEnumConverter<BugStatus>))]
        public BugStatus BugStatus { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter<ReviewStatus>))]
        public ReviewStatus ReviewStatus { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter<TicketPriority>))]
        public TicketPriority? Priority { get; set; }
        public TicketAssigneeResponse? Assignee { get; set; }
        public DateTimeOffset? Deadline { get; set; }
    }
}