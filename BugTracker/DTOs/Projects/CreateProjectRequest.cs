using System.ComponentModel.DataAnnotations;

namespace BugTracker.DTOs.Projects
{
    public class CreateProjectRequest : IValidatableObject
    {
        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string RepositoryUrl { get; set; } = string.Empty;

        public List<int> DeveloperIds { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!Uri.TryCreate(RepositoryUrl, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)
                || (uri.Host != "github.com" && uri.Host != "gitlab.com"))
            {
                yield return new ValidationResult("Укажи ссылку на GitHub или GitLab.", new[] { nameof(RepositoryUrl) });
            }
        }
    }
}
