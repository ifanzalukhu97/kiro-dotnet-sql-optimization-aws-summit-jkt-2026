using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class OrderListDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public int LineCount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class OrderDetailDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public bool IsUndersupplyBackordered { get; set; }
        public List<OrderLineDto> Lines { get; set; }
    }

    public class OrderLineDto
    {
        public int OrderLineId { get; set; }
        public int StockItemId { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string StockItemName { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
