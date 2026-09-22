"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreatePipelineStage, useDeletePipelineStage } from "@/modules/crm/pipelines/mutations";
import type { Pipeline, PipelineStageKind } from "@/modules/crm/pipelines/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const STAGE_KINDS: PipelineStageKind[] = ["OPEN", "WON", "LOST"];

export function PipelineStagesPanel({
  pipeline,
  canUpdate,
}: {
  pipeline: Pipeline;
  canUpdate: boolean;
}) {
  const createStage = useCreatePipelineStage();
  const deleteStage = useDeletePipelineStage();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(String((pipeline.stages?.length ?? 0) + 1));
  const [probability, setProbability] = useState("10");
  const [stageKind, setStageKind] = useState<PipelineStageKind>("OPEN");

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }
    try {
      await createStage.mutateAsync({
        pipelineId: pipeline.id,
        values: {
          name: name.trim(),
          sort_order: Number(sortOrder),
          probability,
          stage_kind: stageKind,
        },
      });
      toast.success("Stage added");
      setName("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete(stageId: string, kind: PipelineStageKind) {
    if (kind === "WON" || kind === "LOST") {
      return;
    }
    try {
      await deleteStage.mutateAsync({ pipelineId: pipeline.id, stageId });
      toast.success("Stage removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const stages = [...(pipeline.stages ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Probability</TableHead>
            <TableHead>Kind</TableHead>
            {canUpdate ? <TableHead className="w-12" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.id}>
              <TableCell>{stage.sort_order}</TableCell>
              <TableCell className="font-medium">{stage.name}</TableCell>
              <TableCell>{stage.probability}%</TableCell>
              <TableCell>{stage.stage_kind}</TableCell>
              {canUpdate ? (
                <TableCell>
                  {stage.stage_kind === "OPEN" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${stage.name}`}
                      onClick={() => void handleDelete(stage.id, stage.stage_kind)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canUpdate ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input
            placeholder="Stage name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            type="number"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={probability}
            onChange={(event) => setProbability(event.target.value)}
          />
          <Select
            value={stageKind}
            onValueChange={(value) => setStageKind(value as PipelineStageKind)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={createStage.isPending}
            onClick={() => void handleCreate()}
          >
            {createStage.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add stage
          </Button>
        </div>
      ) : null}
    </div>
  );
}
