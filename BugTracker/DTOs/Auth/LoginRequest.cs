using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using BugTracker.Models.Enums;

namespace BugTracker.DTOs.Auth
{
    public class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [JsonRequired]
        [EnumDataType(typeof(Role))]
        [JsonConverter(typeof(JsonStringEnumConverter<Role>))]
        public Role Role { get; set; }
    }
}
