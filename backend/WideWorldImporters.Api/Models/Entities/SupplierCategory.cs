using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class SupplierCategory
    {
        public int SupplierCategoryID { get; set; }
        public string SupplierCategoryName { get; set; }

        public ICollection<Supplier> Suppliers { get; set; }
    }
}
