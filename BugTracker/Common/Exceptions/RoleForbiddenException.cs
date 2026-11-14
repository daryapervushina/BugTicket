namespace BugTracker.Common.Exceptions
{
    public class RoleForbiddenException : ForbiddenException
    {
        public RoleForbiddenException(string message) : base(message)
        {
        }
    }
}
