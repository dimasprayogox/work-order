"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";

const AdminPartTable = ({
  parts,
  loading,
  onEdit,
  onDelete,
  selectedParts = [],
  onSelectionChange = () => {},
  onSearch = () => {},
  searchText = "",
}) => {
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState(searchText);

  // useEffect yang sudah diperbaiki - mengikuti pola MachineCategoryTable
  useEffect(() => {
    setGlobalFilterValue(searchText);
    setFilters((prevFilters) => ({
      ...prevFilters,
      global: { ...prevFilters.global, value: searchText },
    }));
  }, [searchText]);

  // onGlobalFilterChange tanpa useCallback - mengikuti pola MachineCategoryTable
  const onGlobalFilterChange = (value) => {
    // Update filter DataTable secara lokal
    const _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);

    // Informasikan ke parent component tentang perubahan search text
    onSearch(value);
  };

  const handleSelectionChange = (e) => {
    onSelectionChange(e.value);
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-button-sm"
        onClick={() => onEdit(rowData)}
        tooltip="Edit"
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        className="p-button-sm"
        onClick={() => onDelete(rowData)}
        tooltip="Delete"
      />
    </div>
  );

  const stockBodyTemplate = (rowData) => {
    const isLowStock = rowData.quantity_in_stock <= rowData.min_stock;
    return (
      <span className={isLowStock ? "text-red-500 font-bold" : ""}>
        {rowData.quantity_in_stock}
      </span>
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl font-bold">Parts Inventory</span>

      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={(e) => {
              const value = e.target.value;
              setGlobalFilterValue(value);
              onGlobalFilterChange(value);
            }}
            placeholder="Search"
          />
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <ConfirmDialog />

      <DataTable
        value={parts}
        selection={selectedParts}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        paginator
        rows={10}
        loading={loading}
        emptyMessage="No parts found."
        filters={filters}
        globalFilterFields={["name", "part_number", "description", "location"]}
        className="border-round-lg"
        rowClassName={() =>
          "hover:bg-gray-50 transition-colors cursor-pointer"
        }
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
        rowsPerPageOptions={[5, 10, 25, 50]}
        header={header}
        selectionMode="multiple"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="name" header="Part Name" style={{ width: "180px" }} sortable />
        <Column field="part_number" header="Part Number" style={{ width: "150px" }} sortable />
        <Column field="description" header="Description" style={{ width: "200px" }} />
        <Column
          field="quantity_in_stock"
          header="Stock"
          body={stockBodyTemplate}
          style={{ width: "80px" }}
          sortable
        />
        <Column field="min_stock" header="Min Stock" style={{ width: "80px" }} sortable />
        <Column field="location" header="Location" style={{ width: "120px" }} sortable />
        <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
      </DataTable>
    </div>
  );
};

export default AdminPartTable;
