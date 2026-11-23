using System.ComponentModel.DataAnnotations;
namespace BugTracker.DTOs.AdminUsers
{
    public class UpdateTesterRequest
    {
        [Required, RegularExpression("^(active|blocked)$")]
        public string Status { get; set; } = string.Empty;
    }
}
