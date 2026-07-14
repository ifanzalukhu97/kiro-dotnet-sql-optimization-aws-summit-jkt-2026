using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class PaginatedResponse<T>
    {
        public List<T> Data { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }
}
