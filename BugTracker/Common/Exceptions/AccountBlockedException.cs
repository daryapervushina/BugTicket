namespace BugTracker.Common.Exceptions
{
    public class AccountBlockedException : ForbiddenException
    {
        public AccountBlockedException(string message) : base(message)
        {
        }
    }
}
