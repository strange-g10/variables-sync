import { logToUI } from "../../utils/log";
import { NodeExportConfig, SortGroup } from "../types";

interface CollectedNode {
  name: string;
  id: string;
  type: string;
}

interface ExportedNodeData {
  fileName: string;
  selectionCount: number;
  roots: {
    [rootName: string]: {
      type: string;
      nodes: CollectedNode[];
    };
  };
}

/**
 * Traverse node tree and collect nodes based on config patterns
 */
function collectSortedNodes(
  node: SceneNode, 
  rootPattern: string, 
  sortGroups: SortGroup[]
): { [rootName: string]: { type: string; nodes: CollectedNode[] } } {
  const rootRegex = new RegExp(rootPattern);
  const nodeDict: { [rootName: string]: Map<string, CollectedNode> } = {}; // Use Map to prevent duplicates
  const result: { [rootName: string]: { type: string; nodes: CollectedNode[] } } = {};

  function traverse(node: SceneNode, currentRoot?: string) {
    const name = node.name;
    const nodeId = node.id;
    const nodeType = node.type;

    // Check if this node matches the root pattern
    if (rootRegex.test(name)) {
      currentRoot = name;
      logToUI(`Found root: ${currentRoot}`);
    }

    // If we're under a root and this node has children, check them
    if (currentRoot && "children" in node && node.children) {
      for (const child of node.children) {
        const childName = child.name;
        const childId = child.id;
        const childType = child.type;

        // Check if child matches any sort group prefix (but only add once)
        let matchedAnyGroup = false;
        for (const group of sortGroups) {
          const prefixRegex = new RegExp(group.prefix);
          if (prefixRegex.test(childName) && !matchedAnyGroup) {
            if (!nodeDict[currentRoot]) {
              nodeDict[currentRoot] = new Map();
            }
            // Use Map to prevent duplicates by ID
            if (!nodeDict[currentRoot].has(childId)) {
              nodeDict[currentRoot].set(childId, {
                name: childName,
                id: childId,
                type: childType
              });
              logToUI(`Found node: ${childName} (ID: ${childId}) under ${currentRoot}`);
            }
            matchedAnyGroup = true; // Prevent multiple matches for same node
            break; // Exit loop after first match
          }
        }
        
        // Continue traversal
        traverse(child as SceneNode, currentRoot);
      }
    } else if ("children" in node && node.children) {
      // Continue traversal without current root
      for (const child of node.children) {
        traverse(child as SceneNode, currentRoot);
      }
    }
  }

  traverse(node);

  // Sort nodes for each root based on sort groups
  for (const [root, nodesMap] of Object.entries(nodeDict)) {
    const sortedNodes: CollectedNode[] = [];
    const processedNodeIds = new Set<string>(); // Track processed nodes to prevent duplicates
    const nodesArray = Array.from(nodesMap.values()); // Convert Map to Array
    
    for (const group of sortGroups) {
      if (group.range) {
        // Handle range-based sorting
        const { rows, cols } = group.range;
        for (let row = rows[0]; row <= rows[1]; row++) {
          for (let col = cols[0]; col <= cols[1]; col++) {
            let expectedName = group.prefix.replace("\\d+", String(col));
            expectedName = expectedName.replace("Row_\\\\d+", `Row_${row}`);
            
            const foundNode = nodesArray.find(n => n.name === expectedName && !processedNodeIds.has(n.id));
            if (foundNode) {
              sortedNodes.push(foundNode);
              processedNodeIds.add(foundNode.id);
              logToUI(`Range sorted: ${foundNode.name} (${foundNode.id})`);
            }
          }
        }
      } else {
        // Handle prefix-only sorting with duplicate prevention
        const prefixRegex = new RegExp(group.prefix);
        const matchingNodes = nodesArray.filter(n => prefixRegex.test(n.name) && !processedNodeIds.has(n.id));
        for (const node of matchingNodes) {
          sortedNodes.push(node);
          processedNodeIds.add(node.id);
          logToUI(`Prefix sorted: ${node.name} (${node.id})`);
        }
      }
    }

    result[root] = {
      type: "tree",
      nodes: sortedNodes
    };
    logToUI(`Collected and sorted ${sortedNodes.length} nodes for ${root}`);
  }

  return result;
}

/**
 * Export selected nodes with configuration
 */
export async function exportSelectedNodes(nodeConfig?: NodeExportConfig) {
  try {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      logToUI("Error: No nodes selected");
      figma.notify("Please select nodes to export");
      return;
    }

    logToUI(`Exporting ${selection.length} selected nodes`);

    // Default configuration if none provided
    const config: NodeExportConfig = nodeConfig || {
      rootPattern: "Role-Body-\\d+|Block-\\d+",
      sortGroups: [
        { prefix: "Row_\\d+_Text_Col_", range: { rows: [1, 10], cols: [1, 4] } },
        { prefix: "Row_\\d+_Visible_Col_", range: { rows: [1, 10], cols: [1, 4] } },
        { prefix: "Title" },
        { prefix: "Item \\d+" }
      ]
    };

    const fileName = `${figma.root.name}_selected_nodes.json`;
    let allCollectedNodes: { [rootName: string]: { type: string; nodes: CollectedNode[] } } = {};

    // Process each selected node
    for (const selectedNode of selection) {
      const collectedFromNode = collectSortedNodes(
        selectedNode as SceneNode,
        config.rootPattern,
        config.sortGroups
      );
      
      // Merge results
      for (const [rootName, rootData] of Object.entries(collectedFromNode)) {
        if (allCollectedNodes[rootName]) {
          // Merge nodes, avoiding duplicates
          const existingIds = new Set(allCollectedNodes[rootName].nodes.map(n => n.id));
          const newNodes = rootData.nodes.filter(n => !existingIds.has(n.id));
          allCollectedNodes[rootName].nodes.push(...newNodes);
        } else {
          allCollectedNodes[rootName] = rootData;
        }
      }
    }

    const data: ExportedNodeData = {
      fileName: figma.root.name,
      selectionCount: selection.length,
      roots: allCollectedNodes
    };

    const totalNodes = Object.values(allCollectedNodes)
      .reduce((sum, root) => sum + root.nodes.length, 0);

    logToUI(`Exported ${totalNodes} nodes from ${Object.keys(allCollectedNodes).length} roots`);
    figma.ui.postMessage({ type: "exported", data, fileName });
    figma.notify(`Exported ${totalNodes} node IDs`);

  } catch (e) {
    logToUI(`Export error: ${(e as Error).message}`);
    figma.notify("Export failed. Check log for details.");
  }
}
