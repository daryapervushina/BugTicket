namespace BugTracker.Data
{
    public interface IDbSeeder
    {
        Task EnsureAdminAsync();
    }
}
