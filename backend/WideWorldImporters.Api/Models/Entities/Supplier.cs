using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class Supplier
    {
        public int SupplierID { get; set; }
        public string SupplierName { get; set; }
        public int SupplierCategoryID { get; set; }
        public int PrimaryContactPersonID { get; set; }

        public SupplierCategory SupplierCategory { get; set; }
        public ICollection<PurchaseOrder> PurchaseOrders { get; set; }
    }
}
