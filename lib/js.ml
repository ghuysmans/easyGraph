open Format

let gen_switch e f = function
  | [] -> ()
  | l ->
    printf "switch (%s) {@;" e;
    l |> List.iter (fun (c, x) ->
      printf "case %S:@;" c;
      f x;
      printf "break;@;"
    );
    printf "}@;"

let gen_if f = function
  | [] -> ()
  | (c, x) :: t ->
    printf "if (%s) {@;" c;
    f x;
    printf "}@;";
    t |> List.iter (fun (c, x) ->
      printf "else if (%s) {@;" c;
      f x;
      printf "}@;"
    )

let gen paradigm ?(cases=gen_switch) (x : Event.t Xstate.t) =
  printf "@[<v>";
  let s = x.id ^ "_state" in
  if paradigm = `Imperative then
    printf "var %s = %S;@;@;" s x.initial;
  printf "function %s(%se) {@;" x.id (
    match paradigm with
    | `Imperative -> ""
    | `Functional -> s ^ ", "
  );
  Array.to_list x.states |> cases s (fun {Xstate.on; _} ->
    on |> List.map (fun ({Event.name; guard; action}, s') ->
      match guard with
      | None -> Printf.sprintf "e == %S" name, (action, s')
      | Some g -> Printf.sprintf "e == %S && (%s)" name g, (action, s')
    ) |> gen_if (fun (action, s') ->
      let () =
        match action with
        | None -> ()
        | Some a -> printf "%s@;" a
      in
      match paradigm with
      | `Imperative -> printf "%s = %S;@;" s s'
      | `Functional -> printf "return %S;@;" s'
    )
  );
  printf "}@]"

let gen_if e f l =
  l |> List.map (fun (c, x) -> Printf.sprintf "%s == %S" e c, x) |> gen_if f
