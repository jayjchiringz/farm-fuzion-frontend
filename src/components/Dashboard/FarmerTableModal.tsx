// src/components/Dashboard/FarmerTableModal.tsx
import React from "react";
import { Farmer, Group } from "@/types"; // adjust import paths accordingly
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  group: Group | null;
  farmers: Farmer[];
  groups: Group[];
  handleAssignGroup: (farmerId: string, groupId: string) => void;
}

export const FarmerTableModal = ({
  open,
  onClose,
  group,
  farmers,
  groups,
  handleAssignGroup,
}: Props) => {
  const filteredFarmers = group
    ? farmers.filter((f) => f.group_id === group.id)
    : farmers;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {group ? `Farmers in ${group.name}` : "All Registered Farmers"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto mt-4">
          <table className="w-full border text-sm">
            <thead className="bg-brand-green text-white">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Group</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((f) => {
                const farmerGroup = groups.find((g) => g.id === f.group_id);
                return (
                  <tr key={f.id} className="odd:bg-slate-100">
                    <td className="p-2 font-medium">
                      {f.first_name} {f.middle_name} {f.last_name}
                    </td>
                    <td className="p-2 text-center">{f.email}</td>
                    <td className="p-2 text-center">
                      {farmerGroup ? (
                        farmerGroup.name
                      ) : (
                        <select
                          className="p-1 border rounded text-sm"
                          onChange={(e) =>
                            handleAssignGroup(f.id, e.target.value)
                          }
                          defaultValue=""
                        >
                          <option value="" disabled>Select Group</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
