using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class StockGroup
    {
        public int StockGroupID { get; set; }
        public string StockGroupName { get; set; }

        public ICollection<StockItemStockGroup> StockItemStockGroups { get; set; }
    }
}
