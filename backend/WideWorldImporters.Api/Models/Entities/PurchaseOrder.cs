using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class PurchaseOrder
    {
        public int PurchaseOrderID { get; set; }
        public int SupplierID { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public bool IsOrderFinalized { get; set; }

        public Supplier Supplier { get; set; }
        public ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; }
    }
}
