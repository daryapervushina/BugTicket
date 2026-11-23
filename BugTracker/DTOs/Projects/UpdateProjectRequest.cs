using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BugTracker.DTOs.Projects
{
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public class UpdateProjectRequest : IValidatableObject
    {
        [StringLength(100, MinimumLength = 1)]
        public string? Name { get; set; }
        public List<int>? DeveloperIds { get; set; }
        public bool? IsChecked { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (IsChecked == false)
            {
                yield return new ValidationResult("Only marking a project as checked is supported.", new[] { nameof(IsChecked) });
            }
            if (Name != null && string.IsNullOrWhiteSpace(Name))
            {
                yield return new ValidationResult("Project name must not be blank.", new[] { nameof(Name) });
            }
            if (Name == null && DeveloperIds == null && IsChecked == null)
            {
                yield return new ValidationResult("Provide a name, the complete developer list, or isChecked.");
            }
        }
    }
}