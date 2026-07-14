namespace WideWorldImporters.Api.Models.Entities
{
    public class Person
    {
        public int PersonID { get; set; }
        public string FullName { get; set; }
        public string PreferredName { get; set; }
        public bool IsEmployee { get; set; }
    }
}
