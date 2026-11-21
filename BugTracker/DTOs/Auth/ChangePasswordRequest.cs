using System.ComponentModel.DataAnnotations;
namespace BugTracker.DTOs.Auth
{
    public class ChangePasswordRequest
    {
        [Required, MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;

        [Required, Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
