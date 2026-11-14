namespace BugTracker.Common.Exceptions
{
    public class InvalidStatusException : ConflictException
    {
        public InvalidStatusException(string message) : base(message)
        {
        }
    }
}
