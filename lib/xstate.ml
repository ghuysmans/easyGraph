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
  let states =
    nodes |> Array.mapi (fun i {isAcceptState; _} ->
      names.(i), {
        typ = if isAcceptState then Some "final" else None;
        on = links |> List.filter_map (function
          | StartLink _ -> None
          | Link {directed = false; _} -> failwith "undirected link"
          | Link {nodeA; _} when nodeA <> i -> None
          | Link {nodeB; text; _} -> Some (text, names.(nodeB))
        );
      }
    )
  in
  let initial =
    match
      links |> List.filter (function
        | StartLink _ -> true
        | _ -> false
      )
    with
    | [] -> failwith "no initial state"
    | [StartLink {directed = false; _}] -> failwith "undirected start link"
    | [StartLink {node; _}] -> names.(node)
    | [_] -> assert false (* filtered above *)
    | _ -> failwith "too many initial states"
  in
  {id; initial; context = (); states}
