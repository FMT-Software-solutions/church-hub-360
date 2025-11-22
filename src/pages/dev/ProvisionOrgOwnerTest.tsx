import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';

export default function ProvisionOrgOwnerTest() {
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !orgId ||
      !orgName ||
      !userEmail ||
      !password ||
      !firstName ||
      !lastName ||
      !secret
    ) {
      toast.error('Fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token =
        session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const payload = {
        organizationDetails: {
          id: orgId,
          name: orgName,
          email: orgEmail || undefined,
          phone: orgPhone || undefined,
          address: orgAddress || undefined,
        },
        userDetails: { firstName, lastName, email: userEmail, password },
        productId: '',
        appName: '',
        provisioningSecret: secret,
      };
      const res = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-organization-owner`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Provisioning failed');
        return;
      }
      toast.success('Provisioned successfully');
    } catch (err) {
      toast.error((err as any)?.message || 'Request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Provision Organization Owner (Test)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization ID</Label>
                  <Input
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="org-uuid"
                  />
                </div>
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Church Name"
                  />
                </div>
                <div>
                  <Label>Organization Email</Label>
                  <Input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="church@mail.com"
                  />
                </div>
                <div>
                  <Label>Organization Phone</Label>
                  <Input
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="+233..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Organization Address</Label>
                  <Input
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    placeholder="Address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Owner First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label>Owner Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <Label>Owner Email</Label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="owner@mail.com"
                  />
                </div>
                <div>
                  <Label>Temporal Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <Label>Provisioning Secret</Label>
                <Input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Secret"
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Provisioning...' : 'Provision'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
