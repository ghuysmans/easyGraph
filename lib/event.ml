type t = {
  name: string;
  guard: string option;
  action: string option;
}

let re =
  Re.(seq [
    start;
    group (rep1 alnum);
    opt (seq [char '['; group (rep1 (compl [char ']'])); char ']']);
    opt (seq [char '/'; group (rep1 any)]);
    stop;
  ] |> compile)

let of_string s =
  let g = Re.exec re s in
  let name = Re.Group.get g 1 in
  let get i =
    if Re.Group.test g i then
      Some (Re.Group.get g i)
    else
      None
  in
  let guard = get 2 in
  let action = get 3 in
  {name; guard; action}

let to_string {name; guard; action} =
  name ^
  (match guard with None -> "" | Some x -> "[" ^ x ^ "]") ^
  (match action with None -> "" | Some x -> "/" ^ x)


let%test_module _ = (module struct
  let not_found f =
    try
      ignore (f ());
      false
    with Not_found ->
      true

  let%test _ = of_string "a" = {
    name = "a";
    guard = None;
    action = None;
  }

  let%test _ = not_found (fun () -> of_string "a[b")

  let%test _ = of_string "a[b]" = {
    name = "a";
    guard = Some "b";
    action = None;
  }

  let%test _ = not_found (fun () -> of_string "a/")

  let%test _ = of_string "a/c" = {
    name = "a";
    guard = None;
    action = Some "c";
  }

  let%test _ = of_string "a[b]/c" = {
    name = "a";
    guard = Some "b";
    action = Some "c";
  }
end)
