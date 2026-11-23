using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using BugTracker.Models.Enums;

namespace BugTracker.DTOs.Auth
{
    public class SwitchRoleRequest
    {
        [JsonRequired]
        [EnumDataType(typeof(Role))]
        [JsonConverter(typeof(JsonStringEnumConverter<Role>))]
        public Role Role { get; set; }
    }
}
