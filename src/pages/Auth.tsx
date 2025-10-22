import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres").optional(),
  whatsapp: z.string().regex(/^\d{10,11}$/, "WhatsApp inválido (apenas números, 10 ou 11 dígitos)").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = isLogin 
        ? { email, password }
        : { email, password, username, whatsapp };
      
      authSchema.parse(data);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, whatsapp },
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({ title: "Cadastro realizado! Você já pode fazer login." });
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-gradient card-shadow border-2 border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {isLogin ? "Entrar" : "Cadastrar"}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {isLogin ? "Entre com sua conta" : "Crie sua conta no marketplace"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="seu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="11999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full hero-gradient" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-semibold"
            >
              {isLogin ? "Cadastre-se" : "Entrar"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
