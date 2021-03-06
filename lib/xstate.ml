type e = string
type s = string

type state = {
  typ: string option; (* final? *)
  on: (e * s) list;
  (* actions: unit; *)
}

type t = {
  id: string;
  initial: s;
  context: unit; (* FIXME *)
  states: (s * state) array;
}


open Graph

let of_graph ~id ~named {nodes; links} =
  let names =
    nodes |> Array.mapi (fun i ({text; _} : node) ->
      if named then
        text
      else
        Printf.sprintf "s%d" i
    )
  in
  let start_links, links =
    links |> List.partition (function
      | StartLink _ -> true
      | Link _ -> false
    )
  in
  let out_edges = Array.(make (length names) []) in
  links |> List.iter (function
    | StartLink _ -> assert false (* filtered above *)
    | Link {directed = false; _} -> failwith "undirected link"
    | Link {nodeA; nodeB; text; _} ->
      out_edges.(nodeA) <- (text, names.(nodeB)) :: out_edges.(nodeA)
  );
  let states =
    nodes |> Array.mapi (fun i {isAcceptState; _} ->
      names.(i), {
        typ = if isAcceptState then Some "final" else None;
        on = out_edges.(i);
      }
    )
  in
  let initial =
    match start_links with
    | [] -> failwith "no initial state"
    | [StartLink {directed = false; _}] -> failwith "undirected start link"
    | [StartLink {node; _}] -> names.(node)
    | [_] -> assert false (* filtered above *)
    | _ -> failwith "too many initial states"
  in
  {id; initial; context = (); states}
