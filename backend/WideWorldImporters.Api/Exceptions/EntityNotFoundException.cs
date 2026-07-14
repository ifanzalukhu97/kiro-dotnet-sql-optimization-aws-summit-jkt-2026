using System;

namespace WideWorldImporters.Api.Exceptions
{
    public class EntityNotFoundException : Exception
    {
        public string ResourceType { get; }
        public string Identifier { get; }

        public EntityNotFoundException(string resourceType, string identifier)
            : base($"Resource '{resourceType}' with identifier '{identifier}' was not found")
        {
            ResourceType = resourceType;
            Identifier = identifier;
        }

        public EntityNotFoundException(string resourceType, int identifier)
            : this(resourceType, identifier.ToString())
        {
        }
    }
}
